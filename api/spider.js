const biliAPI = require('bili-api')

let oneHours = 1000 * 60 * 60

const notable = ({ info, object, time }) => {
  if (!info.recordNum) {
    return true
  }
  if (time - info.time > oneHours) {
    return true
  }
  if (Math.abs(info.archiveView - object.archiveView) * 1000 > info.archiveView) {
    return true
  }
  if (Math.abs(info.follower - object.follower) * 1000 > info.follower) {
    return true
  }
  return false
}

class Spider {
  constructor({ db, vtbs, spiderId, PARALLEL, INTERVAL }) {
    this.db = db
    this.vtbs = vtbs
    this.spiderId = spiderId
    this.PARALLEL = PARALLEL
    this.INTERVAL = INTERVAL
  }
  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
  async start() {
    for (;;) {
      let startTime = (new Date()).getTime()
      await this.round()
      let endTime = (new Date()).getTime()
      await this.wait(this.INTERVAL - (endTime - startTime))
    }
  }
  async round() {
    for (let i = this.spiderId; i < this.vtbs.length; i += this.PARALLEL) {
      let vtb = this.vtbs[i]
      let time = (new Date()).getTime()
      let object = await biliAPI(vtb, ['mid', 'uname', 'roomid', 'sign', 'notice', 'follower', 'archiveView', 'guardNum', 'liveStatus', 'online', 'face'])
      let { mid, uname, roomid, sign, notice, follower, archiveView, guardNum, liveStatus, online, face } = object

      let info = await this.db.info.get(mid)
      if (!info) {
        info = {}
      }
      let { recordNum = 0, liveNum = 0, guardChange = 0 } = info

      if (notable({ info, object, time })) {
        recordNum++
        await this.db.active.put({ mid, num: recordNum, value: { archiveView, follower, time } })
      }

      if (liveStatus) {
        liveNum++
        await this.db.live.put({ mid, num: liveNum, value: { online, time } })
      }

      if (guardNum !== info.guardNum) {
        guardChange++
        await this.db.guard.put({ mid, num: guardChange, value: { guardNum, time } })
      }

      await this.db.info.put(mid, { mid, uname, roomid, sign, notice, face, archiveView, follower, liveStatus, recordNum, guardNum, liveNum, guardChange, time })

      console.log(`UPDATED: ${uname}`)
    }
  }
}

exports.Spider = Spider