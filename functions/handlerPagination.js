exports = function(page, limit, data, totalData, query){
  
  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);
  const parseTotalData = parseInt(totalData);
  
  const totalPage = Math.ceil(parseTotalData/parseLimit);
  const hasNextPage = totalPage > parsePage;
  const nextPage = hasNextPage ? parsePage + 1 : null;
  const hasPrevPage = parsePage > 1;
  const prevPage = hasPrevPage ? parsePage - 1 : null;
  
  const objResponse = {
    docs: data,
    totalDocs: parseTotalData,
    limit: parseLimit,
    page: parsePage,
    totalPage,
    hasNextPage,
    nextPage,
    hasPrevPage,
    prevPage,
    query
  };
  
  return objResponse;
};