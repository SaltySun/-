import { useGlobalStore } from "@/store/global";
import logo from "@/assets/logo.svg";
import { useMujianOpenAPI } from "@/utils/llm";
import { useState } from "react";

function Home() {
  const { baseURL, apiKey, modelId } = useGlobalStore();
	const { query } = useMujianOpenAPI();
  const [inputValue, setInputValue] = useState('');
	return (
		<div className="flex flex-col justify-center items-center h-screen gap-4">
			<img src={logo} alt="幕间" className="w-20 h-20" />
      <h1 className="text-2xl font-bold">初始化成功</h1>
			<div className="flex flex-col justify-start items-start gap-2">
				<p className="break-all">Base URL: <span className="text-gray-500">{baseURL}</span></p>
				<p className="break-all">API Key: <span className="text-gray-500">{apiKey}</span></p>
				<p className="break-all">Model ID: <span className="text-gray-500">{modelId}</span></p>
			</div>
      <div>
        <input type="text" placeholder="请输入问题" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button type="button" disabled={!inputValue} onClick={() => query(inputValue)}>发送</button>
      </div>
		</div>
	);
}

export default Home;
