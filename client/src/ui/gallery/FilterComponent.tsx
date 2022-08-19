import { useState, useCallback } from "react";
import { DateFilter } from "src/domain/filter/DateFilter";
import { GalleryFilter } from "../../domain/filter/GalleryFilter";
import DateFilterComponent from "../filter/DateFilterComponent";
import DateFilterSummaryComponent from "../filter/DateFilterSummaryComponent";

const styles = {
  filterSummary: {
    margin: "10px",
    display: "flex",
  },
  iconWrapper: {
    display: "flex",
    flexDirection: "column" as "column",
    justifyContent: "center",
    margin: "0 8px",
  },
};

type Props = {
  initialFilter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
};

function FilterComponent(props: Props) {
  const { initialFilter, onFilterChange } = props;

  const [filter, setFilter] = useState(initialFilter);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);

  const onDateFilterChange = useCallback((dateFilter: DateFilter) => {
    const filter = new GalleryFilter(dateFilter);

    setFilter(filter);
    onFilterChange(filter);
    console.log("filter change", filter);
  }, []);

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          <button
            type="button"
            className="btn btn-sm btn-light"
            style={styles.filterSummary}
            onClick={() => setShowDateRangePicker(!showDateRangePicker)}
          >
            <DateFilterSummaryComponent dateFilter={filter.dateFilter} />
            <div style={styles.iconWrapper}>
              <i
                className={`fa fa-angle-${showDateRangePicker ? "up" : "down"}`}
              ></i>
            </div>
          </button>
        </div>
      </div>
      {showDateRangePicker && (
        <DateFilterComponent
          initialFilter={initialFilter.dateFilter}
          onFilterChange={(dateFilter: DateFilter) =>
            onDateFilterChange(dateFilter)
          }
        />
      )}
    </div>
  );
}

export default FilterComponent;
