'use strict';

module.exports = function constructQueryParams(url, queryParams) {
  if (url === undefined || queryParams === undefined) { throw new Error("Missing url or query param object"); }
  let queryStringArray = Object.keys(queryParams).map((param) => {
    return `${param}=${queryParams[param]}`;
  });

  if (queryStringArray.length > 0) {
    if (queryStringArray.length === 1) {
      return `${url}?${queryStringArray[0]}`;
    } else {
      url = url += '?';
      let finalQueryString = queryStringArray.reduce((prev, curr) => {
        return `${prev}&${curr}`;
      });
      return url + finalQueryString;
    }
  }
};