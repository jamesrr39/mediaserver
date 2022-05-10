import { FitTrack, Record } from "src/domain/FitTrack";

type Props = {
  trackSummary: FitTrack;
  records: Record[];
  start?: Record;
  end?: Record;
};

export default function ExtractTrackSectionComponent(props: Props) {
  const { records, start, end } = props;

  return <p>TODO</p>;
}
