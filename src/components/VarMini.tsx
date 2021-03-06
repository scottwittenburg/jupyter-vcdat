// Dependencies
import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "reactstrap";

// Project Components
import { MiscUtilities } from "../Utilities";
import AxisInfo from "./AxisInfo";
import DimensionSlider from "./DimensionSlider";
import Variable from "./Variable";

const axisStyle: React.CSSProperties = {
  marginLeft: ".5em"
};
const badgeStyle: React.CSSProperties = {
  margin: "auto",
  marginLeft: "0.5em"
};

const modalOverflow: React.CSSProperties = {
  maxHeight: "70vh",
  overflow: "auto"
};

interface VarMiniProps {
  buttonColor: string; // The hex value for the color
  variable: Variable; // the variable this component will show
  updateDimInfo: Function; // method passed by the parent to update their copy of the variables dimension info
  isSelected: Function; // method to check if this variable is selected in parent
  selectOrder: number;
  allowReload: boolean; // is this variable allowed to be reloaded
  reload: Function; // a function to reload the variable
}
interface VarMiniState {
  showAxis: boolean; // should the edit axis modal be shown
}

export default class VarMini extends React.Component<
  VarMiniProps,
  VarMiniState
> {
  public varName: string;
  constructor(props: VarMiniProps) {
    super(props);
    this.state = {
      showAxis: false
    };
    this.varName = this.props.variable.name;
    this.openMenu = this.openMenu.bind(this);
    this.updateDimInfo = this.updateDimInfo.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  /**
   * @description open the menu if its closed
   */
  public openMenu(): void {
    if (!this.state.showAxis) {
      this.setState({
        showAxis: true
      });
    }
  }

  public updateDimInfo(newInfo: any, varName: string): void {
    this.props.updateDimInfo(newInfo, varName);
  }

  /**
   * @description Toggles the variable loader modal
   */
  public toggleModal(): void {
    this.setState({
      showAxis: !this.state.showAxis
    });
  }

  public render(): JSX.Element {
    return (
      <div>
        <div className="clearfix">
          <Button
            outline={true}
            color={this.props.isSelected ? "success" : "secondary"}
            style={
              this.props.isSelected && {
                backgroundColor: this.props.buttonColor
              }
            }
            active={this.props.isSelected(this.varName)}
          >
            {this.props.variable.name}
          </Button>
          <Button
            outline={true}
            style={axisStyle}
            title={
              this.props.variable.sourceName == ""
                ? "Editing of modified variables disabled for now."
                : ""
            }
            disabled={this.props.variable.sourceName == ""}
            color={this.props.variable.sourceName == "" ? "dark" : "danger"}
            onClick={(clickEvent: React.MouseEvent<HTMLButtonElement>) => {
              this.setState({
                showAxis: !this.state.showAxis
              });
              clickEvent.stopPropagation();
            }}
          >
            edit
          </Button>
          {this.props.isSelected(this.varName) && (
            <Badge
              className="float-right"
              style={{
                ...badgeStyle,
                ...{ backgroundColor: this.props.buttonColor }
              }}
            >
              {MiscUtilities.numToOrdStr(this.props.selectOrder)} Variable
            </Badge>
          )}
        </div>
        <Modal
          id="var-loader-modal"
          isOpen={this.state.showAxis}
          toggle={this.toggleModal}
          size="lg"
        >
          <ModalHeader toggle={this.toggleModal}>Edit Axis</ModalHeader>
          <ModalBody style={modalOverflow}>
            {this.state.showAxis &&
              this.props.variable.axisInfo.length > 0 &&
              this.props.variable.axisInfo.map((item: AxisInfo) => {
                if (item.data.length <= 1) {
                  return;
                }
                item.updateDimInfo = this.updateDimInfo;
                return (
                  <div key={item.name} style={axisStyle}>
                    <Card>
                      <CardBody>
                        <DimensionSlider {...item} varName={this.varName} />
                      </CardBody>
                    </Card>
                  </div>
                );
              })}
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onClick={() => {
                this.toggleModal();
                this.props.reload(this.props.variable);
              }}
            >
              Update
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
