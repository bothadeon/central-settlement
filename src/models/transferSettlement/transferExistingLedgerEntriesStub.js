'use strict'

const Db = require('../../lib/db')
const Config = require('../../lib/config')

const getWTFforNow = async function () {
  try {
    await connect()
    const knex = await Db.getKnex()
    const transferId = '154cbf04-bac7-444d-aa66-76f66126d7f5'

    return knex.transaction(async (trx) => {
      try {
        await knex.from(knex.raw('transferParticipant (transferID, participantCurrencyId, transferParticipantRoleTypeId, ledgerEntryTypeId, amount)'))
          .transacting(trx)
          .insert(function () {
            this.from('transferParticipant AS TP')
              .select('TP.transferId', 'TP.participantCurrencyId', 'TP.transferParticipantRoleTypeId', 'TP.ledgerEntryTypeId', knex.raw('?? * -1', ['TP.amount']))
              .innerJoin('participantCurrency AS PC', 'TP.participantCurrencyId', 'PC.participantCurrencyId')
              .innerJoin('settlementModel AS M', 'PC.ledgerAccountTypeId', 'M.ledgerAccountTypeId')
              .innerJoin('settlementGranularity AS G', 'M.settlementGranularityId', 'G.settlementGranularityId')
              .where(function () {
                this.where({ 'TP.transferId': transferId })
                this.andWhere(function () {
                  this.andWhere({ 'G.name': 'GROSS' })
                })
              })
              .union(function () {
                this.select('TP.transferId', 'PC1.participantCurrencyId', 'TP.transferParticipantRoleTypeId', 'TP.ledgerEntryTypeId', 'TP.amount')
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
        await trx.commit
        return 'committed'
      } catch (err) {
        console.log('Error ' + err)
        await trx.rollback
        return 'failed'
      } finally {
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
