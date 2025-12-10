import { Navigate, useParams } from 'react-router-dom';

export default function MoldSpecificationDetail() {
  const { id } = useParams();
  return <Navigate to={`/molds/detail/${id}`} replace />;
}