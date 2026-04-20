import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "@/pages/home";
import GamePage from "@/pages/game";

import { useGlobalStore } from "@/store/global";
import { useEffect } from "react";
import type MujianSdkLite from "@mujian/js-sdk/lite";

const router = createBrowserRouter([
	{
		path: "/",
		element: <GamePage />,
	},
	{
		path: "/game",
		element: <GamePage />,
	},
]);

export const ReactRouterProvider = () => {
	const { init } = useGlobalStore();
	useEffect(() => {
		init(window.$mujian_lite as MujianSdkLite);
	}, [init]);
	return <RouterProvider router={router} />;
};
