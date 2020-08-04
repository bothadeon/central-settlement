'use strict'

const Db = require('../../lib/db')
const Config = require('../../lib/config')

const getWTFforNow = async function () {
  try {
    await connect()
    const knex = await Db.getKnex()
    const transferStateChange = [
      {
        transferId: '154cbf04-bac7-444d-aa66-76f66126d7f5',
        transferStateId: 'SETTLED',
        reason: 'Gross settlement process'
      }
    ]

    return knex.transaction(async (trx) => {
      try {
        await knex('transferStateChange').insert(transferStateChange)
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
