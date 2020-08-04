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
        await knex('participantPosition AS PP')
          .update({ value: knex.raw('?? + ??', ['PP.value', 'TR.amount']) })
          .innerJoin(function () {
            this.from('transferParticipant AS TP')
              .select('PC.participantCurrencyId', 'TP.Amount')
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
                this.select('PC1.participantCurrencyId', 'TP.amount')
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
              }).as('TR')
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
