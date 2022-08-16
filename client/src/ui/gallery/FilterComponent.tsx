import * as React from "react";
import { GalleryFilter, DateFilter } from "../../domain/Filter";
import { themeStyles } from "../../theme/theme";

const styles = {
  enableDateFilterCheckbox: {
    marginRight: "5px",
  },
  container: {
    padding: "5px",
    margin: "10px",
    background: "lightgrey",
  },
  customiseButton: {
    ...themeStyles.button,
    margin: "0 10px",
  },
  dateFilter: {
    background: "lightgrey",
    paddingLeft: "20px",
  },
  searchPlaceholder: {
    color: "#666",
    display: "flex",
    justifyContent: "space-between",
  },
  summaryBar: {
    flexGrow: 1,
    backgroundColor: "rgb(200,200,200)",
    borderRadius: "20px",
    padding: "8px",
  },
  searchIcon: {
    fontSize: "1.5em",
    padding: "5px",
  },
};

type Props = {
  initialFilter: GalleryFilter;
  initialStartDateValue?: Date;
  initialEndDateValue?: Date;
  onFilterChange: (filter: GalleryFilter) => void;
};

type ComponentState = {
  startDateValue: Date;
  endDateValue: Date;
  dateFilterEnabled: boolean;
  includeFilesWithoutDates: boolean;
  showEditFilter: boolean;
};

function dateToISODateString(date: Date) {
  return date.toISOString().split("T")[0];
}

export class FilterComponent extends React.Component<Props, ComponentState> {
  state = {
    startDateValue:
      (this.props.initialFilter.dateFilter &&
        this.props.initialFilter.dateFilter.startDate) ||
      this.props.initialStartDateValue ||
      new Date(0),
    endDateValue:
      (this.props.initialFilter.dateFilter &&
        this.props.initialFilter.dateFilter.endDate) ||
      this.props.initialEndDateValue ||
      new Date(),
    dateFilterEnabled: Boolean(this.props.initialFilter.dateFilter),
    includeFilesWithoutDates:
      (this.props.initialFilter.dateFilter &&
        this.props.initialFilter.dateFilter.includeFilesWithoutDates) ||
      true,
    showEditFilter: false,
  };

  componentDidUpdate(prevProps: Props, prevState: ComponentState) {
    const { state } = this;
    const hasChanged =
      state.startDateValue.getTime() !== prevState.startDateValue.getTime() ||
      state.endDateValue.getTime() !== prevState.endDateValue.getTime() ||
      state.dateFilterEnabled !== prevState.dateFilterEnabled ||
      state.includeFilesWithoutDates !== prevState.includeFilesWithoutDates;

    if (hasChanged) {
      this.props.onFilterChange(this.getFilter());
    }
  }

  render() {
    const filter = this.getFilter();

    const { showEditFilter } = this.state;

    return (
      <div style={styles.container}>
        <div style={styles.searchPlaceholder}>
          <i className="fa fa-search" style={styles.searchIcon}></i>
          <span style={styles.summaryBar}>{filter.getSummary()}</span>
          <button
            className="btn btn-default"
            type="button"
            onClick={() =>
              this.setState((state) => ({
                ...state,
                showEditFilter: !showEditFilter,
              }))
            }
          >
            {showEditFilter ? (
              <i className="fa fa-times"></i>
            ) : (
              <i className="fa fa-pencil"></i>
            )}
          </button>
        </div>
        {showEditFilter && this.renderEditContainer()}
      </div>
    );
  }

  private renderEditContainer = () => {
    const {
      startDateValue,
      endDateValue,
      dateFilterEnabled,
      includeFilesWithoutDates,
    } = this.state;
    const maxStartDate = dateFilterEnabled ? endDateValue : new Date();
    const minEndDate = dateFilterEnabled ? startDateValue : new Date(0);

    return (
      <div className="form-group">
        <div className="checkbox">
          <label>
            <input
              style={styles.enableDateFilterCheckbox}
              type="checkbox"
              onChange={this.enableDateFilterCheckboxChange}
              checked={dateFilterEnabled}
            />
            Show files in a date range
          </label>
        </div>
        <div style={styles.dateFilter}>
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
  };

  private getFilter() {
    const {
      startDateValue,
      endDateValue,
      dateFilterEnabled,
      includeFilesWithoutDates,
    } = this.state;

    const dateFilter = dateFilterEnabled
      ? new DateFilter(startDateValue, endDateValue, includeFilesWithoutDates)
      : null;

    const filter = new GalleryFilter(dateFilter);

    return filter;
  }

  private enableDateFilterCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const dateFilterEnabled = event.target.checked;

    this.setState((state) => ({
      ...state,
      dateFilterEnabled,
    }));
  };

  private onStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const startDateValue = new Date(event.target.value);
    const endDateValue =
      startDateValue > this.state.endDateValue
        ? new Date()
        : this.state.endDateValue;

    this.setState((state) => ({
      ...state,
      startDateValue,
      endDateValue,
    }));
  };

  private onIncludeFilesWithoutDatesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const includeFilesWithoutDates = event.target.checked;

    this.setState((state) => ({
      ...state,
      includeFilesWithoutDates,
    }));
  };

  private onEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const endDateValue = new Date(event.target.value);
    const startDateValue =
      endDateValue < this.state.startDateValue
        ? new Date(0)
        : this.state.startDateValue;

    this.setState((state) => ({
      ...state,
      startDateValue,
      endDateValue,
    }));
  };
}
