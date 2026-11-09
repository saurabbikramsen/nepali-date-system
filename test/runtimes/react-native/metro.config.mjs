// The Metro config a new React Native 0.88 app is created with, written as ESM so it needs no
// CommonJS globals, plus one watch folder: the shared checks are in the parent folder, outside
// this project, and Metro only bundles files inside the project or a watch folder.
import path from "node:path";
import { getDefaultConfig, mergeConfig } from "@react-native/metro-config";

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  watchFolders: [path.resolve(import.meta.dirname, "..")],
};

export default mergeConfig(getDefaultConfig(import.meta.dirname), config);
