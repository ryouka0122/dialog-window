
// Plugins
import { registerPlugins } from '@/plugins'

// Components
import Parent from './Parent.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(Parent)

registerPlugins(app)

app.mount('#app')
