import * as WebBrowser from "expo-web-browser";
import { Share } from "react-native";

export const exportResume = (url: string): Promise<void> => WebBrowser.openBrowserAsync(url).then();

export const exportLetter = (text: string): Promise<void> =>
  Share.share({ message: text }).then(() => undefined);
