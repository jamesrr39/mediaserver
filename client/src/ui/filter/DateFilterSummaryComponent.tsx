import { DateFilter } from "src/domain/filter/DateFilter";

type Props = {
  dateFilter: DateFilter;
};

function DateFilterSummaryComponent(props: Props) {
  const { start, end, includeFilesWithoutDates } = props.dateFilter;

  if (!start && !end) {
    return <span>All date ranges</span>;
  }

  if (start && end) {
    if (includeFilesWithoutDates) {
      return (
        <span>
          Between {start.toLocaleDateString()} and {end.toLocaleDateString()}
          <br />
          including files without dates
        </span>
      );
    }

    return (
      <span>
        Between {start.toLocaleDateString()} and {end.toLocaleDateString()}
        <br />
        excluding files without dates
      </span>
    );
  }

  if (!start) {
    // only an end date
    if (includeFilesWithoutDates) {
      return (
        <span>
          Before {end.toLocaleDateString()}
          <br />
          including files without dates
        </span>
      );
    }

    return (
      <span>
        Before {end.toLocaleDateString()}
        <br />
        excluding files without dates
      </span>
    );
  }

  // only a start date

  if (includeFilesWithoutDates) {
    return (
      <span>
        After {start.toLocaleDateString()}
        <br />
        including files without dates
      </span>
    );
  }

  return (
    <span>
      After {start.toLocaleDateString()}
      <br />
      excluding files without dates
    </span>
  );
}

export default DateFilterSummaryComponent;
