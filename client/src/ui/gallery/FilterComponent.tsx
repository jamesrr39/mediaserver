import * as React from "react";
import { GalleryFilter } from "../../domain/filter/GalleryFilter";
import { themeStyles } from "../../theme/theme";

type Props = {
  initialFilter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
};

function FilterComponent(props: Props) {
  const { initialFilter, onFilterChange } = props;

  const [filter, setFilter] = React.useState(initialFilter);

  return (
    <div className="container-fluid">
      <p>{filter.dateFilter.summary()}</p>
    </div>
  );
}

export default FilterComponent;
