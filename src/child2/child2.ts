
// Plugins
import { registerPlugins } from '@/plugins'

// Components
import Child1 from './Child2.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(Child1)

registerPlugins(app)

app.mount('#app')
