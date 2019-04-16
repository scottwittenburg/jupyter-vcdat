// Dependencies
import * as React from "react";

interface InteractiveDivProps {
}

interface InteractiveDivState {
}

export default class InteractiveDiv extends React.Component<
  InteractiveDivProps,
  InteractiveDivState
> {
  constructor(props: InteractiveDivProps) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    return (
      <div>
        <p>Hello!</p>
      </div>
    );
  }
}
