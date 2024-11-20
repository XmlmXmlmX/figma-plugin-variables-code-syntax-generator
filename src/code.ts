import { cssEscape, getCamlVariableName, getCssVariableName } from "./Helpers";
import ISettings from "./ISettings";

figma.showUI(__html__, {
  height: 524,
  width: 512,
  themeColors: true,
});

export function collection(
  settings: ISettings,
  variable: Variable,
  suffix?: string
) {
  if (!suffix) suffix = "-";

  if (settings.additionalCollectionPrefixes) {
    const collections = figma.variables.getLocalVariableCollections();

    if (settings.autoAbbreviations) {
      const name = collections.find(
        (c) => c.id === variable.variableCollectionId
      )?.name;

      if (name?.includes("Primitive")) {
        return `prim${suffix}`;
      } else if (name?.includes("Semantic")) {
        return `sem${suffix}`;
      } else if (name?.includes("Component")) {
        return `comp${suffix}`;
      }
    } else {
      return (
        collections
          .find((c) => c.id === variable.variableCollectionId)
          ?.name.replace(/[^a-zA-Z0-9-_]+/g, "") + suffix
      );
    }
  } else {
    console.log("skip collections");
    return "";
  }
}

function process(_settings: ISettings) {
  let vars = figma.variables.getLocalVariables(_settings.variableTypeFilter);

  const varTypePrefix: string = (() => {
    if (_settings.webVariableType === "SASS") {
      return "$";
    } else if (_settings.webVariableType === "LESS") {
      return "@";
    } else {
      return "--";
    }
  })();

  const webPrefix = cssEscape(
    _settings.prefix ? `${_settings.prefix}-` : ''
  );

  if (_settings.selectedCollectionId) {
    vars = vars.filter((v) =>
      v.variableCollectionId.match(_settings.selectedCollectionId!)
    );
  }

  if (_settings.variableNameQueryFilter) {
    const expression = new RegExp(_settings.variableNameQueryFilter, "g");
    vars = vars.filter((v) => v.name.match(expression));
  }

  vars.forEach((v) => {
    console.log("### ->", webPrefix, collection(_settings, v), v.name);
    let _cssVariableName = getCssVariableName(
      `${webPrefix}${collection(_settings, v)}${v.name}`,
      _settings
    );
    const testDuplicateStrings = /(.*\-{1})\1/g;
    const test = testDuplicateStrings.exec(_cssVariableName);

    if (test) {
      console.log("duplicate strings found!");
      _cssVariableName = _cssVariableName.replace(test[0], test[1]);
    }

    console.log("Variable name: ", _cssVariableName);
    if (!v.codeSyntax.WEB || _settings.webForce || _settings.webClear) {
      if (_settings.webClear && v.codeSyntax.WEB) {
        v.removeVariableCodeSyntax("WEB");
      } else if (_settings.webVariableType === "CSS" && _settings.useVarWrapping) {
        v.setVariableCodeSyntax("WEB",`var(${varTypePrefix}${_cssVariableName})`);
      } else {
        v.setVariableCodeSyntax("WEB", `${varTypePrefix}${_cssVariableName}`);
      }
    }
    if (!v.codeSyntax.ANDROID || _settings.androidForce || _settings.androidClear) {
      if (_settings.androidClear && v.codeSyntax.ANDROID) {
        console.log("remove android");
        v.removeVariableCodeSyntax("ANDROID");
      } else {
        v.setVariableCodeSyntax(
          "ANDROID",
          getCamlVariableName(_cssVariableName, _settings)
        );
      }
    }
    if (!v.codeSyntax.iOS || _settings.iosForce || _settings.iosClear) {
      if (_settings.iosClear && v.codeSyntax.iOS) {
        v.removeVariableCodeSyntax("iOS");
      } else {
        v.setVariableCodeSyntax(
          "iOS",
          getCamlVariableName(_cssVariableName, _settings)
        );
      }
    }
  });
}

function getCollections () {
  return figma.variables
    .getLocalVariableCollections()
    .map((c) => {
      return { id: c.id, name: c.name };
    })
    .sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
}

figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case "run":
      process(msg.settings);
      figma.ui.postMessage({
        collections: getCollections(),
        type: 'SUCCESS'
      });
      break;
    case "init":
      figma.ui.postMessage({
        collections: getCollections(),
        type: 'COLLECTIONS'
      });
      break;
    case "close":
      figma.closePlugin();
      break;
  }
};
