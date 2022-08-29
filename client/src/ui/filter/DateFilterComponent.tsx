import { useState } from "react";
import { DateFilter } from "src/domain/filter/DateFilter";
import { toISO8601Date } from "src/domain/filter/GalleryFilter";

type Props = {
  initialFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
};

function DateFilterComponent(props: Props) {
  const { initialFilter, onFilterChange } = props;

  const [filter, setFilterState] = useState(initialFilter);

  const { start, end, includeFilesWithoutDates } = filter;

  const setFilter = (dateFilter: DateFilter) => {
    setFilterState(dateFilter);
    onFilterChange(dateFilter);
  };

  return (
    <div className="row">
      <div className="col">
        <div>
          <label>
            From
            <input
              type="date"
              className="form-control"
              max={(end && toISO8601Date(end)) || toISO8601Date(new Date())}
              onChange={(event) => {
                const { value } = event.target;

                setFilter(
                  new DateFilter({
                    ...filter,
                    start: new Date(value),
                  })
                );
              }}
            />
          </label>
          <button
            type="button"
            disabled={!Boolean(filter.start)}
            onClick={() => {
              setFilter(
                new DateFilter({
                  ...filter,
                  start: undefined,
                })
              );
            }}
          >
            <i className="fa fa-times"></i>
          </button>
          &nbsp;
          <label>
            to
            <input
              type="date"
              className="form-control"
              min={start && toISO8601Date(start)}
              max={toISO8601Date(new Date())}
              onChange={(event) => {
                const { value } = event.target;

                setFilter(
                  new DateFilter({
                    ...filter,
                    end: new Date(value),
                  })
                );
              }}
            />
          </label>
          <button
            type="button"
            disabled={!Boolean(end)}
            onClick={() => {
              setFilter(
                new DateFilter({
                  ...filter,
                  end: undefined,
                })
              );
            }}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              onChange={(event) => {
                const { checked } = event.target;

                setFilter(
                  new DateFilter({
                    ...filter,
                    includeFilesWithoutDates: checked,
                  })
                );
              }}
              defaultChecked={includeFilesWithoutDates}
            />
            Include files without a date
          </label>
        </div>
      </div>
    </div>
  );
}

export default DateFilterComponent;
