import { storage } from "@/config/storage/storage";
import type { ReactotronReactNative } from "reactotron-react-native";
import Reactotron from "reactotron-react-native";
import mmkvPlugin from "reactotron-react-native-mmkv";

Reactotron.configure()
  .useReactNative()
  .use(mmkvPlugin<ReactotronReactNative>({ storage }))
  .connect();
