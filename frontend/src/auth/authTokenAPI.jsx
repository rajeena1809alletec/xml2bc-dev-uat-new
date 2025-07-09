import React, { useEffect, useState } from "react";


function GetAccessToken() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   fetch("http://localhost:3001/getToken")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       if (data.access_token) setToken(data.access_token);
  //       else setError(data);
  //     })
  //     .catch((err) => setError(err.message));
  // }, []);

  return (
    <div>
      <h3>Access Token Fetch Result</h3>
      {token && <p>Token: {token}</p>}
      {error && <pre style={{ color: "red" }}>{JSON.stringify(error, null, 2)}</pre>}
      {!token && !error && <p>Loading...</p>}
      <h2 className="text-xl mb-4 font-semibold">Authenticated WBS Upload</h2>
    </div>
  );
}

export default GetAccessToken;
