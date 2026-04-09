export type Dictionary = {
  [key: string]: string | Dictionary;
};

export type TranslateParams = Record<string, string | number>;

export type Translator = (key: string, params?: TranslateParams) => string;
