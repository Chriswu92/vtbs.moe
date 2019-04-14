import Vue from 'vue'
import Vuex from 'vuex'

import { get } from '@/socket'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    vtbs: [],
    info: {},
    face: {},
    logs: []
  },
  getters: {
    followerRank: state => {
      return [...state.vtbs].sort((a, b) => {
        if (!state.info[a.mid] || !state.info[b.mid]) {
          return 0
        }
        return state.info[b.mid].follower - state.info[a.mid].follower
      })
    }
  },
  mutations: {
    SOCKET_vtbs(state, data) {
      state.vtbs = [...data]
    },
    SOCKET_info(state, data) {
      state.info = { ...state.info, [data.mid]: data }
    },
    loadFace(state, { mid, face }) {
      state.face = { ...state.face, [mid]: face }
    },
    SOCKET_log(state, data) {
      state.logs.push({ time: (new Date()).toLocaleString(), data })
      if (state.logs.length > 256) {
        state.logs.shift()
      }
    }
  },
  actions: {
    async SOCKET_vtbs({ commit, state }, data) {
      for (let i = 0; i < data.length; i++) {
        let mid = data[i].mid
        if (!state.face[mid]) {
          let face = `data:image/png;base64,${await get('face', mid)}`
          commit('loadFace', { mid, face })
        }
      }
    }
  }
})
