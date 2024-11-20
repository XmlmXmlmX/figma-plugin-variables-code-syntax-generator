import WebVariableType from "./WebVariableType";

export default interface ISettings {
  generateWeb: boolean;
  generateIos: boolean;
  generateAndroid: boolean;
  useVarWrapping: boolean;
  percentAutoConvert: boolean;
  autoAbbreviations: boolean;
  additionalCollectionPrefixes: boolean;
  reduceRepeatingPhrasesInName: boolean;
  prefix: string;
  webForce: boolean;
  webClear: boolean;
  iosForce: boolean;
  iosClear: boolean;
  androidForce: boolean;
  androidClear: boolean;
  variableNameQueryFilter: string;
  variableTypeFilter: VariableResolvedDataType | undefined;
  selectedCollectionId: string | undefined;
  webVariableType: WebVariableType;
}
