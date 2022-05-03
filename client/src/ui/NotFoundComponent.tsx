import * as React from "react";

type Props = {
  message: string;
};

class NotFoundComponent extends React.Component<Props> {
  render() {
    return <p>{this.props.message}</p>;
  }
}

export default NotFoundComponent;
