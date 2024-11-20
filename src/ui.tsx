import * as React from "react";
import * as ReactDOM from "react-dom/client";
import ISettings from "./ISettings";
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
import './figma-plugin-ds-overrides.css'
import "./ui.css";
import { getCssVariableName } from "./Helpers";

interface IAppState extends ISettings {
  isRunning: boolean,
  collections: VariableCollection[],
  success?: boolean,
}

function App() {
  const [state, setState] = React.useState<IAppState>({
    isRunning: false,
    generateWeb: true,
    generateIos: true,
    generateAndroid: true,
    useVarWrapping: true,
    percentAutoConvert: true,
    autoAbbreviations: true,
    additionalCollectionPrefixes: true,
    reduceRepeatingPhrasesInName: true,
    prefix: "",
    webForce: false,
    webClear: false,
    iosForce: false,
    iosClear: false,
    androidForce: false,
    androidClear: false,
    variableNameQueryFilter: "",
    variableTypeFilter: undefined,
    collections: [],
    selectedCollectionId: undefined,
    webVariableType: "CSS"
  });

  React.useEffect(() => {
    window.onmessage = async (event: MessageEvent) => {
      switch (event.data.pluginMessage.type) {
        case 'COLLECTIONS':
          setState(
            {
              ...state,
              collections: event.data.pluginMessage.collections
            }
          );
          break;
        case 'SUCCESS':
          setState({ ...state, success: true, isRunning: false });
          break;
      }
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: "init"
        },
      },
      "*"
    );

    return () => {
      window.onmessage = null;
    };
  }, []);

  const onRun = () => {
    setState(Object.assign(state, { isRunning: true, success: false }));
    parent.postMessage(
      {
        pluginMessage: {
          type: "run",
          settings: state,
        },
      },
      "*"
    );
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };

  const renderCssPreview = () => {
    if (state.webClear) {
      return "";
    }

    let name = getCssVariableName(
      `${state.additionalCollectionPrefixes ? state.autoAbbreviations ? 'coll-' : 'collection-' : ''}variable-name`,
      state
    );

    name = state.prefix ? `${state.prefix}-${name}` : name;

    switch (state.webVariableType) {
      case "CSS":
        if (state.useVarWrapping) {
          return `var(--${name})`;
        } else {
          return `--${name}`;
        }
      case "LESS":
        return `@${name}`;
      case "SASS":
        return `$${name}`;
    }
  };

  return (
    <main>
      {state.success ?
        <span className="toast success">Success</span>
        : <></>
      }
      <div className="main">
        <label className="label" htmlFor="variableTypeFilter">Filter on varible type</label>
        <div className="input">
          <select id="variableTypeFilter" className="input__field" defaultValue={state.variableTypeFilter} onChange={(event) => {
            setState({ ...state, variableTypeFilter: event.target.value as VariableResolvedDataType });
          }}>
            <option value={undefined}>All</option>
            <option value="BOOLEAN" >Booleans</option>
            <option value="COLOR" >Colors</option>
            <option value="FLOAT" >Numbers</option>
            <option value="STRING" >Strings</option>
          </select>
        </div>
        <label className="label" htmlFor="selectedCollectionId">Collection</label>
        <div className="input">
          {state.collections.length <= 0 ?
            <div className="icon icon--spinner icon--spin"></div> : <></>}
          <select id="selectedCollectionId" className="input__field" defaultValue={state.selectedCollectionId} onChange={(event) => {
            setState({ ...state, selectedCollectionId: event.target.value });
          }}>
            <option value={undefined}>All</option>
            {state.collections.map((item, index) =>
              <option value={item.id} key={index}>{item.name}</option>
            )}
          </select>
        </div>
        <label className="label" htmlFor="collectionQueryFilter">Variable name query filter</label>
        <div className="input">
          <input
            id="variableNameQueryFilter"
            value={state.variableNameQueryFilter}
            onChange={(event) => {
              setState({ ...state, variableNameQueryFilter: event.target.value });
            }}
            type="input"
            className="input__field"
            placeholder="((size|border)-100)+"
            aria-details="variableNameQueryFilter_details"
          />
        </div>
        <small className="type" id="variableNameQueryFilter_details">
          Regular expression syntax can be used
        </small>
        <label className="label" htmlFor="prefix">Prefix</label>
        <div className="input">
          <input
            id="prefix"
            value={state.prefix}
            onChange={(event) => {
              setState({ ...state, prefix: event.target.value });
            }}
            type="input"
            className="input__field"
            placeholder="Prefix"
            aria-details="prefix_details"
          />
        </div>
        <small className="type" id="prefix_details">
          The dashes before and after will be added automatically to CSS variables.
        </small>
        <div className="checkbox">
          <input defaultChecked={state.additionalCollectionPrefixes}
            onChange={(event) => {
              setState({ ...state, additionalCollectionPrefixes: event.target.checked });
            }} id="coll" type="checkbox" className="checkbox__box" />
          <label htmlFor="coll" className="checkbox__label"
          >Additional collection prefix</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.autoAbbreviations} disabled={!state.additionalCollectionPrefixes}
            onChange={(event) => {
              setState({ ...state, autoAbbreviations: event.target.checked });
            }} id="abbr" type="checkbox" className="checkbox__box" />
          <label htmlFor="abbr" className="checkbox__label"
          >Use collection name abbrevations</label>
        </div>
        <div className="checkbox">
          <input defaultChecked={state.generateWeb}
            onChange={(event) => {
              setState({ ...state, generateWeb: event.target.checked });
            }}
            id="web" type="checkbox" className="checkbox__box" />
          <label htmlFor="web" className="checkbox__label">Generate for Web</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.webClear}
            onChange={(event) => {
              setState({ ...state, webClear: event.target.checked });
            }}
            disabled={!state.generateWeb}
            id="webClear" type="checkbox" className="checkbox__box" />
          <label htmlFor="webClear" className="checkbox__label">Clear (no generation)</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.webForce}
            onChange={(event) => {
              setState({ ...state, webForce: event.target.checked });
            }}
            disabled={state.webClear || !state.generateWeb}
            id="webForce" type="checkbox" className="checkbox__box" />
          <label htmlFor="webForce" className="checkbox__label">
            <i className="icon icon--warning icon--red"></i>
            Force (overwrite)
          </label>
        </div>
        <div className="ml-small flex-column">
          <div className="flex-row">
            <label className="label" htmlFor="webVariableType">Web variable type:</label>
            <div className="radio">
              <input id="webVariableType_Css" defaultChecked={state.webVariableType === "CSS"}
                onChange={() => {
                  setState({ ...state, webVariableType: "CSS" });
                }} disabled={!state.generateWeb || state.webClear} type="radio" className="radio__button" value="CSS" name="webVariableType" />
              <label htmlFor="webVariableType_Css" className="radio__label">CSS</label>
            </div>
            <div className="radio">
              <input id="webVariableType_Sass" defaultChecked={state.webVariableType === "SASS"}
                onChange={() => {
                  setState({ ...state, webVariableType: "SASS" });
                }} disabled={!state.generateWeb || state.webClear} type="radio" className="radio__button" value="SASS" name="webVariableType" />
              <label htmlFor="webVariableType_Sass" className="radio__label">SASS</label>
            </div>
            <div className="radio">
              <input id="webVariableType_Less" defaultChecked={state.webVariableType === "LESS"}
                onChange={() => {
                  setState({ ...state, webVariableType: "LESS" });
                }} disabled={!state.generateWeb || state.webClear} type="radio" className="radio__button" value="LESS" name="webVariableType" />
              <label htmlFor="webVariableType_Less" className="radio__label">LESS</label>
            </div>
          </div>
          <div className="checkbox">
            <input
              id="varWrapping"
              defaultChecked={state.useVarWrapping}
              onChange={(event) => {
                setState({ ...state, useVarWrapping: event.target.checked });
              }}
              disabled={!state.generateWeb || state.webClear || !(state.webVariableType === "CSS")}
              type="checkbox"
              className="checkbox__box"
            />
            <label htmlFor="varWrapping" className="checkbox__label"
            >Use CSS variable wrapping</label>
          </div>
          <small className="type" id="css_preview">
            <code>{renderCssPreview()}</code>
          </small>
        </div>
        <div className="checkbox">
          <input defaultChecked={state.generateIos}
            onChange={(event) => {
              setState({ ...state, generateIos: event.target.checked });
            }} id="ios" type="checkbox" className="checkbox__box" />
          <label htmlFor="ios" className="checkbox__label">Generate for iOS</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.iosClear}
            onChange={(event) => {
              setState({ ...state, iosClear: event.target.checked });
            }}
            disabled={!state.generateIos}
            id="iosClear" type="checkbox" className="checkbox__box" />
          <label htmlFor="iosClear" className="checkbox__label">Clear (no generation)</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.iosForce}
            onChange={(event) => {
              setState({ ...state, iosForce: event.target.checked });
            }}
            disabled={state.iosClear || !state.generateIos}
            id="iosForce" type="checkbox" className="checkbox__box" />
          <label htmlFor="iosForce" className="checkbox__label">
            <i className="icon icon--warning icon--red"></i>
            Force (overwrite)
          </label>
        </div>
        <div className="checkbox">
          <input defaultChecked={state.generateAndroid}
            onChange={(event) => {
              setState({ ...state, generateAndroid: event.target.checked });
            }} id="android" type="checkbox" className="checkbox__box" />
          <label htmlFor="android" className="checkbox__label">Generate for Android</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.androidClear}
            onChange={(event) => {
              setState({ ...state, androidClear: event.target.checked });
            }}
            disabled={!state.generateAndroid}
            id="androidClear" type="checkbox" className="checkbox__box" />
          <label htmlFor="androidClear" className="checkbox__label">Clear (no generation)</label>
        </div>
        <div className="checkbox ml-small">
          <input defaultChecked={state.androidForce}
            onChange={(event) => {
              setState({ ...state, androidForce: event.target.checked });
            }}
            disabled={state.androidClear || !state.generateAndroid}
            id="androidForce" type="checkbox" className="checkbox__box" />
          <label htmlFor="androidForce" className="checkbox__label">
            <i className="icon icon--warning icon--red"></i>
            Force (overwrite)
          </label>
        </div>
        <div className="onboarding-tip" id="platformAlert">
          <div className="icon icon--alert icon--white"></div>
          <div className="onboarding-tip__msg">You must select at least one platform.</div>
        </div>
        <div className="checkbox">
          <input
            id="percentAutoConvert"
            defaultChecked={state.percentAutoConvert}
            onChange={(event) => {
              setState({ ...state, percentAutoConvert: event.target.checked });
            }}
            type="checkbox"
            className="checkbox__box"
          />
          <label htmlFor="percentAutoConvert" className="checkbox__label"
          >Convert `%` to `pct` in variable names</label>
        </div>
        <div className="checkbox">
          <input
            id="reduceNameRepeatText"
            defaultChecked={state.reduceRepeatingPhrasesInName}
            onChange={(event) => {
              setState({ ...state, reduceRepeatingPhrasesInName: event.target.checked });
            }}
            type="checkbox"
            className="checkbox__box"
            aria-details="reduceNameRepeatText_details"
          />
          <label htmlFor="reduceNameRepeatText" className="checkbox__label"
          >Reduce repeating phrases in name</label>
        </div>
        <small className="type" id="reduceNameRepeatText_details">
          <code>--prefix-group-group-name</code> to
          <code>--prefix-group-name</code>
        </small>
      </div>
      <div className="bottom-bar">
        <button id="cancel" className="button button--tertiary" onClick={onCancel}>Cancel</button>
        <button id="run" className="button button--primary" disabled={state.isRunning} onClick={onRun}>
          {state.isRunning ? <i className="icon icon--spinner icon--spin icon-white"></i> : "Run"}
        </button>
      </div>
    </main >
  );
}

ReactDOM.createRoot(document.getElementById("react-page")!).render(<App />);
