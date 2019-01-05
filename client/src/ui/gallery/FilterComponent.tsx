import * as React from 'react';
import { GalleryFilter, DateFilter } from '../../domain/Filter';

const styles = {
  container: {
    padding: '10px',
    background: 'lightgreen',
    margin: '10px',
  },
};

type Props = {
  initialFilter: GalleryFilter;
  initialStartDateValue?: Date;
  initialEndDateValue?: Date;
  onFilterChange: (filter: GalleryFilter) => void;
};

type ComponentState = {
  startDateValue: Date,
  endDateValue: Date,
  dateFilterEnabled: boolean,
  includeFilesWithoutDates: boolean,
};

function dateToISODateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export class FilterComponent extends React.Component<Props, ComponentState> {
  state = {
    startDateValue: this.props.initialFilter.dateFilter &&
     this.props.initialFilter.dateFilter.startDate || this.props.initialStartDateValue || new Date(0),
    endDateValue: this.props.initialFilter.dateFilter && 
      this.props.initialFilter.dateFilter.endDate || this.props.initialEndDateValue || new Date(),
    dateFilterEnabled: Boolean(this.props.initialFilter.dateFilter),
    includeFilesWithoutDates: this.props.initialFilter.dateFilter && 
      this.props.initialFilter.dateFilter.includeFilesWithoutDates || true,
  };

  componentDidUpdate() {
    const { startDateValue, endDateValue, dateFilterEnabled, includeFilesWithoutDates } = this.state;

    const dateFilter = dateFilterEnabled ? 
      new DateFilter(startDateValue, endDateValue, includeFilesWithoutDates) : 
      null;

    const filter = new GalleryFilter(
      dateFilter,
    );

    this.props.onFilterChange(filter);
  }

  render() {
    const { startDateValue, endDateValue, dateFilterEnabled, includeFilesWithoutDates } = this.state;
    const maxStartDate = dateFilterEnabled ? endDateValue : new Date();
    const minEndDate = dateFilterEnabled ? startDateValue : new Date(0);

    return (
      <div style={styles.container}>
        <div>
          <label>
            <input
              type="checkbox"
              onChange={this.enableDateFilterCheckboxChange}
              checked={dateFilterEnabled}
            />
            Show files in a date range
          </label>
            <div>
              Between
              <input
                type="date"
                onChange={this.onStartDateChange}
                value={dateToISODateString(startDateValue)}
                max={dateToISODateString(maxStartDate)}
                disabled={!dateFilterEnabled}
              />
              and
              <input
                type="date"
                onChange={this.onEndDateChange}
                value={dateToISODateString(endDateValue)}
                min={dateToISODateString(minEndDate)}
                max={dateToISODateString(new Date())}
                disabled={!dateFilterEnabled}
              />
            </div>
            <div>
              <label>
                Show items without a date
                <input
                  type="checkbox"
                  onChange={this.onIncludeFilesWithoutDatesChange}
                  checked={includeFilesWithoutDates}
                  disabled={!dateFilterEnabled}
                />
              </label>
            </div>
        </div>
      </div>
    );
  }

  private enableDateFilterCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateFilterEnabled = event.target.checked;

    this.setState(state => ({
      ...state,
      dateFilterEnabled,
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

  private onIncludeFilesWithoutDatesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const includeFilesWithoutDates = event.target.checked;

    this.setState(state => ({
      ...state,
      includeFilesWithoutDates,
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
