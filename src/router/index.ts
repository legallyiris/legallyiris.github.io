import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			redirect: "/home",
		},
		{
			path: "/home",
			name: "home",
			component: HomeView,
			meta: { nav: true },
		},
		{
			path: "/writing",
			name: "writing",
			meta: { nav: true },
			children: [
				{
					name: "writing-root",
					path: "",
					component: () => import("../views/Writing/WritingRoot.vue"),
				},
				{
					path: ":slug",
					name: "post",
					component: () => import("../views/Writing/_slug.vue"),
				},
			],
		},
		{
			path: "/projects",
			name: "projects",
			children: [
				{
					name: "projects-root",
					path: "",
					component: () => import("../views/Projects/ProjectsRoot.vue"),
				},
				{
					path: ":slug",
					component: () => import("../views/Projects/_slug.vue"),
				},
			],
			meta: { nav: true },
		},
		{
			path: "/uses",
			name: "uses",
			component: () => import("../views/UsesView.vue"),
			meta: { nav: true },
		},
		{
			path: "/:pathMatch(.*)*",
			name: "not-found",
			component: () => import("../views/NotFound.vue"),
		},
	],
});

export default router;
