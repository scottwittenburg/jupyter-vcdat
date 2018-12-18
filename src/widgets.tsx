import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Widget } from '@phosphor/widgets';
import { LeftSideBar } from './components/LeftSideBar';
import { CommandRegistry } from '@phosphor/commands';
import { DocumentRegistry } from '@jupyterlab/docregistry';

const GET_VARS_CMD =
'import __main__\n\
import json\n\
def variables():\n\
    out = []\n\
    for nm, obj in __main__.__dict__.items():\n\
        if isinstance(obj, cdms2.MV2.TransientVariable):\n\
            out+=[nm]\n\
    return out\n\
def graphic_methods():\n\
    out = {}\n\
    for typ in vcs.graphicsmethodlist():\n\
        out[typ] = vcs.listelements(typ)\n\
    return out\n\
def templates():\n\
    return vcs.listelements("template")\n\
def list_all():\n\
    out = {}\n\
    out["variables"] = variables()\n\
    out["gm"] = graphic_methods()\n\
    out["template"] = templates()\n\
    return out\n\
print("{}|{}|{})".format(variables(),templates(),graphic_methods()))';

export class LeftSideBarWidget extends Widget {

    div: HTMLDivElement;                // The div container for this widget
    commands: CommandRegistry;          // Jupyter app CommandRegistry
    context: DocumentRegistry.Context;  // Jupyter app DocumentRegistry.Context
    notebook: any;                      // The notebook this widget is interacting with
    variables: string;
    props: any;                         // An object that stores the props to pass down to LeftSideBar
    component: any;                     // the LeftSidebar component
    currentGm: string                   // name of the active graphics method
    currentVariable: string             // name of the activate variable
    currentTemplate: string             // name of the activate template
    current_path: string
    constructor(commands: CommandRegistry, context: DocumentRegistry.Context) {
        super();
        this.div = document.createElement('div');
        this.div.id = 'left-sidebar';
        this.node.appendChild(this.div);
        this.commands = commands;
        this.context = context;
        this.notebook = null;
        this.currentGm = '';
        this.currentVariable = '';
        this.currentTemplate = '';
        this.inject = this.inject.bind(this);
        this.current_path = "clt.nc";
        if(this.context){
            this.current_path = this.context.session.name;
        }
        this.props = {
            variables: [],
            graphicsMethods: {},
            templates: [],
            //The handlers below are run when a variable, template or graphicMethod link is clicked
            varClickHandler: (listName: string, varName: string) => {
                listName = listName.replace(/\s/g, '');
                varName = varName.replace(/\s/g, '');
                if (this.currentVariable != varName) {
                    this.currentVariable = varName;
                }
            },
            templateClickHandler: (listName: string, tmplName: string) => {
                tmplName = tmplName.replace(/\s/g, '');
                if (this.currentTemplate != tmplName) {
                    this.currentTemplate = 'template_' + tmplName;
                    let tmplString = `${this.currentTemplate} = x.gettemplate('${tmplName}')`;
                    this.inject(tmplString);
                }
            },
            graphClickHandler: (graphicType: string, graphicName: string) => {
                graphicName = graphicName.replace(/\s/g, '');
                graphicType = graphicType.replace(/\s/g, '');
                if (this.currentGm != graphicName) {
                    this.currentGm = 'gm_' + graphicName;
                    let gmLoadString = `${this.currentGm} = vcs.get${graphicType}('${graphicName}')`;
                    this.inject(gmLoadString);
                }
            },
            //These are the refresh and plot handlers.
            refreshAction: () => {
                this.updateVars(context);
            },
            // plot using the currently selected variable, gm, template
            plotAction: () => {
                if(!this.currentVariable){
                    this.inject('# Please select a variable from the left panel');
                } else {
                    let gm = this.currentGm;
                    let temp = this.currentTemplate;
                    if(!gm){
                        gm = '"default"';
                    }
                    if(!temp){
                        temp = '"default"';
                    }
                    let plotString = `x.clear()\nx.plot(${this.currentVariable}, ${gm}, ${temp})`;
                    this.inject(plotString);
                }
            },
            clearAction: () => {
                // this.currentPanel.console.clear();
            },
            //file_path: this.context.session.name,
            file_path: this.current_path,
            inject: this.inject
        };
        this.component = ReactDOM.render(
            <LeftSideBar {...this.props} />,
            this.div);

        this.updateVars = this.updateVars.bind(this);
    }
    updatePath(file_path: string) {
        this.component.setState({
            file_path: file_path
        });
    }
    inject(code: string){
        this.notebook.content.activeCell.model.value.text = code;
        var prom = this.commands.execute('notebook:run-cell');
        this.commands.execute('notebook:insert-cell-below');
        return prom;
    }
    //This is where the code injection occurs in the current console.
    updateVars(context: DocumentRegistry.Context) {
        if (!this.notebook) {
            let path = "";
            let preferredLanguage = "";

            if(context){
                this.context = context
                this.props.file_path = context.session.name;
                this.updatePath(context.session.name);
                console.log(this.context);
                path = context.path;
                preferredLanguage = this.context.model.defaultKernelLanguage;
            }

            // Create Console and inject code
            this.commands.execute('notebook:create-new', {
                activate: true,
                path: path,
                preferredLanguage: preferredLanguage
            }).then(notebook => {
                notebook.session.ready.then(() => {
                    this.notebook = notebook;
                    var injectCmd = `import cdms2\nimport vcs\nx = vcs.init()\ndata = cdms2.open('${this.props.file_path}')`
                    let p = this.inject(injectCmd).then(() => {
                        this.notebook.content.activeCell.model.value.text = GET_VARS_CMD;
                        this.commands.execute('notebook:run-cell').then(() => {
                            this.handleGetVarsComplete();
                            this.commands.execute('notebook:insert-cell-below');
                        });
                    }).catch((err) => {
                        console.log(err);
                    });
                })
            });
        }
        else {
            this.notebook.content.activeCell.model.value.text = GET_VARS_CMD;
            this.commands.execute('notebook:run-cell').then(() => {
                this.handleGetVarsComplete();
                this.commands.execute('notebook:insert-cell-below');
            });
        }
    }
    //Helper function to convert output string to an object/dictionary
    outputStrToDict(output: string) {
        var dict: any = { variables: {}, templates: {}, graphicsMethods: {} };
        var outputElements = output.replace(/\'/g, "").split('|');
        dict.variables = outputElements[0].slice(1, -1).split(',');

        let idx = dict.variables.indexOf(' selectedVariable')
        if( idx != -1){
            dict.variables.splice(idx, 1);
        }
        dict.templates = outputElements[1].slice(1, -1).split(',');

        //var pattern = /?=\]\}\)/;
        var first: boolean = true;
        var prevKey: string = "";
        outputElements[2].slice(1, -1).split(':').forEach((str) => {
            if (first) {//first element is only a key
                dict.graphicsMethods[str] = [];
                prevKey = str;
                first = false;
            }
            else if (str.endsWith("]})")) {//last element is only a value
                dict.graphicsMethods[prevKey] = str.slice(2, -3).split(',');
            }
            else {//A value/key pair
                var pair = str.split('], ');
                dict.graphicsMethods[prevKey] = pair[0].slice(2).split(',');
                prevKey = pair[1];
            }
        });

        return dict;
    }
    handleGetVarsComplete() {
        //Once injection is done read output as string
        var consoleOutputStr: string;
        var jpOutputAreas: HTMLCollectionOf<Element>;
        jpOutputAreas = document.getElementsByClassName("jp-OutputArea-output");
        consoleOutputStr = jpOutputAreas[jpOutputAreas.length - 1].getElementsByTagName("pre")[0].innerHTML;
        var outputObj = this.outputStrToDict(consoleOutputStr);

        this.component.updateListInfo(
            outputObj["variables"],
            outputObj["graphicsMethods"],
            outputObj["templates"])

        this.commands.execute('notebook:delete-cell');
    }
}

export class NCViewerWidget extends Widget {
    constructor(context: DocumentRegistry.Context) {
        super();
        this.context = context;
    }
    readonly context: DocumentRegistry.Context;
    readonly ready = Promise.resolve(void 0);
}


export default { LeftSideBarWidget, NCViewerWidget };
