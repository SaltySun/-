import type MujianSdkLite from "@mujian/js-sdk/lite";
import { create } from "zustand";

type GlobalState = {
	apiKey: string;
	baseURL: string;
  modelId: string;
	init: (mujian_lite: MujianSdkLite) => Promise<void>;
};

console.log(import.meta.env);

export const useGlobalStore = create<GlobalState>((set) => ({
	baseURL: "https://openapi.mujian.ai/v1",
	apiKey: import.meta.env.VITE_MUJIAN_API_KEY,
  modelId: "deepseek-v3.2",
	init: async (mujian_lite: MujianSdkLite) => {
		mujian_lite.init().then(() => {
			set({
				apiKey: mujian_lite.openapi?.apiKey ?? "",
				baseURL: mujian_lite.openapi?.baseURL ?? "",
			});
		});
	},
}));
