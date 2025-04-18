<script setup lang="ts">
import Breadcrumb from '@/components/BreadCrumbs.vue'
import { nextTick, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import router from './../router'

const currentTransition = ref('slide-right')
const initialLoad = ref(true)

const getRouteIndex = (path: string) => {
	const routes = router.getRoutes()
	const flatRoutes = routes.flatMap((route) => {
		if (route.children) {
			return [route, ...route.children]
		}
		return route
	})
	return flatRoutes.findIndex((r) => r.path === path)
}

const isChildRoute = (from: string, to: string) => {
	return to.startsWith(from) && to !== from
}

const isParentRoute = (from: string, to: string) => {
	return from.startsWith(to) && from !== to
}

watch(
	() => router.currentRoute.value,
	(to, from) => {
		if (!from) return

		// @ts-expect-error ts is lying.
		if (window.navigation) {
			// @ts-expect-error ts is lying.
			const navType = window.navigation.currentEntry?.navigationType
			if (navType === 'back') {
				currentTransition.value = 'slide-right'
				return
			}
			if (navType === 'forward') {
				currentTransition.value = 'slide-left'
				return
			}
		}

		if (isChildRoute(from.path, to.path)) {
			currentTransition.value = 'slide-left'
			return
		}
		if (isParentRoute(from.path, to.path)) {
			currentTransition.value = 'slide-right'
			return
		}

		const fromIndex = getRouteIndex(from.path)
		const toIndex = getRouteIndex(to.path)
		currentTransition.value = fromIndex < toIndex ? 'slide-left' : 'slide-right'
	},
	{ immediate: true },
)

watch(
	() => router.currentRoute.value,
	async () => {
		if (initialLoad.value) {
			initialLoad.value = false
			return
		}

		await nextTick()
		await new Promise((resolve) => setTimeout(resolve, 300))

		const mainHeading = document.querySelector('.pane-panel.content h1') as HTMLElement
		if (mainHeading) {
			mainHeading.setAttribute('tabindex', '-1')
			mainHeading.focus()
		}
	},
)
</script>

<template>
	<RouterView v-slot="{ Component }">
		<transition :name="currentTransition" mode="out-in">
			<div :key="$route.path" class="pane-panel content" id="main-view">
				<nav class="pane-titlebar" aria-label="Breadcrumbs">
					<Breadcrumb :route="$route" />
				</nav>
				<main class="pane-main" :aria-label="`${String($route.name)} page content`">
					<component :is="Component" />
				</main>
			</div>
		</transition>
	</RouterView>
</template>

<style scoped lang="scss">
@use '../css/_variables.scss' as *;

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
	transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-left-enter-from {
	opacity: 0;
	transform: translateX(30px);
}
.slide-left-leave-to {
	opacity: 0;
	transform: translateX(-30px);
	filter: blur(1rem) brightness(0.25);
}

.slide-right-enter-from {
	opacity: 0;
	transform: translateX(-30px);
}
.slide-right-leave-to {
	opacity: 0;
	transform: translateX(30px);
}

@media (prefers-reduced-motion: reduce) {
	.slide-left-enter-active,
	.slide-left-leave-active,
	.slide-right-enter-active,
	.slide-right-leave-active {
		transition: none;
	}

	.slide-left-enter-from,
	.slide-left-leave-to,
	.slide-right-enter-from,
	.slide-right-leave-to {
		opacity: 1;
		transform: translateX(0);
	}
}
</style>
