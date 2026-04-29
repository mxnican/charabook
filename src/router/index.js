import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WorkDetailView from '../views/WorkDetailView.vue'
import CharacterView from '../views/CharacterView.vue'
import PlotListView from '../views/PlotListView.vue'
import PlotEditView from '../views/PlotEditView.vue'
import IdeaView from '../views/IdeaView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/work/:id?', name: 'work-detail', component: WorkDetailView },
  { path: '/character/:id?', name: 'character', component: CharacterView },
  { path: '/plot/:id?', name: 'plot-list', component: PlotListView },
  { path: '/plot/edit/:id?', name: 'plot-edit', component: PlotEditView },
  { path: '/idea/:id?', name: 'idea', component: IdeaView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
