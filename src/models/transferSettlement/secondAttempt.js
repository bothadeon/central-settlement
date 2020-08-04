'use strict'

const Db = require('../../lib/db')
const Config = require('../../lib/config')

const getWTFforNow = async function () {
  try {
    await connect()
    const transferId = '154cbf04-bac7-444d-aa66-76f66126d7f5'
    const knex = await Db.getKnex()

    //   INSERT INTO participantPositionChange(participantPositionId, transferStateChangeId, value, reservedValue)
    //   SELECT
    //   PP.participantPositionId
    //     , TSC.transferStateChangeId
    //     , PP.value
    //     , PP.reservedValue
    //   FROM
    //   participantPosition PP
    //   INNER JOIN
    //   (SELECT
    //   PC.participantCurrencyId
    //   FROM
    //   transferparticipant TP
    //   INNER JOIN participantcurrency PC ON TP.participantCurrencyId = PC.participantCurrencyId
    //   INNER JOIN transferparticipantroletype R ON TP.transferParticipantRoleTypeId = R.transferParticipantRoleTypeId
    //   INNER JOIN settlementmodel M ON PC.ledgerAccountTypeId = M.ledgerAccountTypeId
    //   INNER JOIN settlementgranularity G ON M.settlementGranularityId = G.settlementGranularityId
    //   WHERE
    //   TP.transferId = @ThisTransfer
    //   AND G.name = 'GROSS'
    //   AND R.name = 'PAYER_DFSP'
    //   UNION SELECT
    //   PC1.participantCurrencyId
    //   FROM
    //   transferparticipant TP
    //   INNER JOIN participantcurrency PC ON TP.participantCurrencyId = PC.participantCurrencyId
    //   INNER JOIN settlementmodel M ON PC.ledgerAccountTypeId = PC.ledgerAccountTypeId
    //   INNER JOIN settlementgranularity G ON M.settlementGranularityId = G.settlementGranularityId
    //   INNER JOIN participantCurrency PC1 ON
    //   PC1.currencyId = PC.currencyId
    //   AND PC1.participantId = PC.participantId
    //   AND PC1.ledgerAccountTypeId = M.settlementAccountId
    //   WHERE
    //   TP.transferId = @ThisTransfer
    //   AND G.name = 'GROSS'
    // ) AS TR ON PP.participantCurrencyId = TR.ParticipantCurrencyId
    //   INNER JOIN transferStateChange TSC ON TSC.transferID = @ThisTransfer AND TSC.transferStateId = 'SETTLED'
    //   ;

    return knex.transaction(async (trx) => {
      try {
        await knex.from(knex.raw('participantPositionChange (participantPositionId, transferStateChangeId, value, reservedValue)'))
          .insert(function () {
            this.from('participantPosition AS PP')
              .select('PP.participantPositionId', 'TSC.transferStateChangeId', 'PP.value', 'PP.reservedValue')
              .innerJoin(function () {
                this.from('transferParticipant AS TP')
                  .select('PC.participantCurrencyId')
                  .innerJoin('participantCurrency AS PC', 'TP.participantCurrencyId', 'PC.participantCurrencyId')
                  .innerJoin('settlementModel AS M', 'PC.ledgerAccountTypeId', 'M.ledgerAccountTypeId')
                  .innerJoin('settlementGranularity AS G', 'M.settlementGranularityId', 'G.settlementGranularityId')
                  .innerJoin('transferParticipantRoleType AS R', 'TP.transferParticipantRoleTypeId', 'R.transferParticipantRoleTypeId')
                  .where(function () {
                    this.where({ 'TP.transferId': transferId })
                    this.andWhere(function () {
                      this.andWhere({ 'G.name': 'GROSS' })
                      this.andWhere({ 'R.name': 'PAYER_DFSP' })
                    })
                  })
                  .union(function () {
                    this.select('PC1.participantCurrencyId')
                      .from('transferParticipant AS TP')
                      .innerJoin('participantCurrency AS PC', 'TP.participantCurrencyId', 'PC.participantCurrencyId')
                      .innerJoin('settlementModel AS M', 'PC.ledgerAccountTypeId', 'PC.ledgerAccountTypeId')
                      .innerJoin('settlementGranularity AS G', 'M.settlementGranularityId', 'G.settlementGranularityId')
                      .innerJoin('participantCurrency AS PC1', function () {
                        this.on('PC1.currencyId', 'PC.currencyId')
                          .andOn('PC1.participantId', 'PC.participantId')
                          .andOn('PC1.ledgerAccountTypeId', 'M.settlementAccountTypeId')
                      })
                      .where(function () {
                        this.where({ 'TP.transferId': transferId })
                        this.andWhere(function () {
                          this.andWhere({ 'G.name': 'GROSS' })
                        })
                      })
                  })
              })
            this.joinRaw('AS TR ON PP.participantCurrencyId = TR.ParticipantCurrencyId')
              .innerJoin('transferStateChange AS TSC', function () {
                this.on('TSC.transferID', knex.raw('?', [transferId]))
                  .andOn('TSC.transferStateId', '=', knex.raw('?', ['SETTLED']))
              })
          })
        await trx.commit
        return 'committed'
      } catch (err) {
        console.log('Error ' + err)
        // console.log('Here is my query' + query.toSQL().sql);
        await trx.rollback
        return 'failed'
      } finally {
        // await knex.destroy()
        return 'finaly'
      }
    })
  } catch (e) {
    console.log('error 2 : ' + e)
  }
}

async function connect () {
  return Db.connect(Config.DATABASE)
}

async function main () {
  try {
    console.log(await getWTFforNow())
  } catch (e) {
    console.log(e)
  }
}

main()
