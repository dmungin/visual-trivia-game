import { createRouter, createWebHistory } from 'vue-router'
import GameSetup from '../components/GameSetup.vue'
import ImageCurator from '../components/ImageCurator.vue'
import RoundAssignment from '../components/RoundAssignment.vue'
import GameBoard from '../components/GameBoard.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'setup',
            component: GameSetup
        },
        {
            path: '/curator',
            name: 'curator',
            component: ImageCurator
        },
        {
            path: '/assign',
            name: 'assign',
            component: RoundAssignment
        },
        {
            path: '/game',
            name: 'game',
            component: GameBoard
        },
        {
            path: '/print-key',
            name: 'print-key',
            component: () => import('../components/PrintableAnswerKey.vue')
        }
    ]
})

export default router
