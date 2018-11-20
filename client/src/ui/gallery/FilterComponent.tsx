import * as React from 'react';
import { GalleryFilter } from '../../domain/Filter';

const styles = {
  container: {
    padding: '10px',
    background: 'lightgreen',
    margin: '10px',
  },
};

type Props = {
  initialFilter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
};

type ComponentState = {
  startDateValue: Date,
  endDateValue: Date,
  startDateEnabled: boolean,
  endDateEnabled: boolean,
};

function dateToISODateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export class FilterComponent extends React.Component<Props, ComponentState> {
  state = {
    startDateValue: this.props.initialFilter.startDate || new Date(0),
    endDateValue: this.props.initialFilter.endDate || new Date(),
    startDateEnabled: Boolean(this.props.initialFilter.startDate),
    endDateEnabled: Boolean(this.props.initialFilter.endDate),
  };

  componentWillUpdate() {
    const { startDateValue, endDateValue, startDateEnabled, endDateEnabled } = this.state;

    const filter = new GalleryFilter(
      startDateEnabled ? startDateValue : undefined,
      endDateEnabled ? endDateValue : undefined,
    );

    this.props.onFilterChange(filter);
  }

  render() {
    const { startDateValue, endDateValue, startDateEnabled, endDateEnabled } = this.state;
    const maxStartDate = endDateEnabled ? endDateValue : new Date();
    const minEndDate = startDateEnabled ? startDateValue : new Date(0);

    return (
      <div style={styles.container}>
        <div>
          <input
            type="checkbox"
            onChange={this.onStartDateCheckboxChange}
            checked={startDateEnabled}
          />
          <label>
            From
            <input
              type="date"
              onChange={this.onStartDateChange}
              value={dateToISODateString(startDateValue)}
              max={dateToISODateString(maxStartDate)}
              disabled={!startDateEnabled}
            />
          </label>
        </div>
        <div>
          <input
            type="checkbox"
            onChange={this.onEndDateCheckboxChange}
            checked={endDateEnabled}
          />
          <label>
            To
            <input
              type="date"
              onChange={this.onEndDateChange}
              value={dateToISODateString(endDateValue)}
              min={dateToISODateString(minEndDate)}
              max={dateToISODateString(new Date())}
              disabled={!endDateEnabled}
            />
          </label>
        </div>
      </div>
    );
  }

  private onStartDateCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const startDateEnabled = event.target.checked;

    this.setState(state => ({
      ...state,
      startDateEnabled,
    }));
  }

  private onStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const startDateValue = new Date(event.target.value);
    const endDateValue = startDateValue > this.state.endDateValue
      ? new Date()
      : this.state.endDateValue;

    this.setState(state => ({
      ...state,
      startDateValue,
      endDateValue,
    }));
  }

  private onEndDateCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const endDateEnabled = event.target.checked;

    this.setState(state => ({
      ...state,
      endDateEnabled,
    }));
  }

  private onEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const endDateValue = new Date(event.target.value);
    const startDateValue = endDateValue < this.state.startDateValue
      ? new Date(0)
      : this.state.startDateValue;

    this.setState(state => ({
      ...state,
      startDateValue,
      endDateValue,
    }));
  }
}
