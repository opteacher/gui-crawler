import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import MyLib from '@lib/index'
import '@lib/assets/main.css'
import './style.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import apis from '@/apis/index'
import router from '@/router'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App)
  .use(Antd)
  .use(MyLib)
  .use(pinia)
  .use(apis)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    // Use contextBridge
    window.ipcRenderer.on('main-process-message', (_event, message) => {
      console.log(message)
    })
  })
