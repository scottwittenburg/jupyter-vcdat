// Dependencies
import { Widget } from "@phosphor/widgets";
import * as React from "react";
import * as ReactDOM from "react-dom";

// Project Components
import InteractiveDiv from "./InteractiveDiv";
/**
 * This is the main component for the vcdat extension.
 */
export class InteractiveWidget extends Widget {
  public div: HTMLDivElement; // The div container for this widget
  public InteractiveDivRef: InteractiveDiv; // the LeftSidebar component

  constructor() {
    super();
    this.div = document.createElement("div");
    this.div.id = "left-sidebar";
    this.node.appendChild(this.div);
    this.InteractiveDivRef = (React as any).createRef();
    ReactDOM.render(<InteractiveDiv />, this.div);
  }
}

export default { InteractiveWidget };
