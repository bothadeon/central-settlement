'use strict'

const Db = require('../../lib/db')
const Config = require('../../lib/config')

const getWTFforNow = async function () {
  try {
    await connect()
    const knex = await Db.getKnex()
    const transferState = [
      {
        transferstateId: 'SETTLED',
        enumeration: 'SETTLED',
        description: 'The transfer has been settled',
        isActive: 1
      }
    ]

    return knex.transaction(async (trx) => {
      try {
        await knex.raw(knex('transferState').insert(transferState).toString().replace('insert', 'INSERT IGNORE'))
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
