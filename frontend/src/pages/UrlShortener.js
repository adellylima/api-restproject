import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const Container = styled.div`
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`;

const Input = styled.input`
  margin-bottom: 15px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-right: 10px;

  &:hover {
    background-color: #0056b3;
  }

  &:last-child {
    background-color: #dc3545;
    &:hover {
      background-color: #c82333;
    }
  }
`;

const UrlList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin-top: 20px;
`;

const UrlItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
`;

const UrlDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UrlText = styled.span`
  font-size: 14px;
  color: #555;
`;

const ShortUrl = styled.a`
  font-size: 14px;
  color: #007bff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const AccessCount = styled.span`
  font-size: 12px;
  color: #888;
`;

const UpdatedTime = styled.span`
  font-size: 12px;
  color: #888;
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
`;

const SuccessMessage = styled.p`
  color: green;
  text-align: center;
`;

function UrlShortener() {
  const [url, setUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [newUrl, setNewUrl] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/auth/check-auth",
        { withCredentials: true }
      );
      if (response.data.isAuthenticated) {
        setIsAuthenticated(true);
        fetchUrls();
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error checking authentication:", err);
      setIsAuthenticated(false);
    }
  };

  const fetchUrls = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/url/list", {
        withCredentials: true,
      });
      setUrls(response.data);
    } catch (err) {
      console.error("Error fetching URLs:", err);
      setError("Error fetching URLs. Please try again.");
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8000/api/url/shorten",
        { url },
        { withCredentials: true }
      );

      setShortenedUrl(response.data.shortenedUrl);
      if (isAuthenticated) fetchUrls();
      setUrl("");
      setSuccessMessage("URL shortened successfully!");
    } catch (err) {
      console.error("Error shortening URL:", err);
      setError("Error shortening URL. Please try again.");
    }
  };

  const handleUrlClick = async (shortId) => {
    try {
      await axios.get(`http://localhost:8000/api/url/${shortId}/increment`);
      window.location.href = `http://localhost:8000/${shortId}`;
    } catch (err) {
      console.error("Error counting click:", err);
      setError("Error counting click. Please try again.");
    }
  };

  const handleEdit = async (shortId) => {
    try {
      await axios.put(
        `http://localhost:8000/api/url/${shortId}/edit`,
        { newUrl },
        { withCredentials: true }
      );

      setEditing(null);
      setNewUrl("");
      fetchUrls();
      setSuccessMessage("URL updated successfully!");
    } catch (err) {
      console.error("Error editing URL:", err);
      setError("Error editing URL. Please try again.");
    }
  };

  const handleDelete = async (shortId) => {
    try {
      await axios.delete(`http://localhost:8000/api/url/${shortId}/delete`, {
        withCredentials: true,
      });

      fetchUrls();
      setSuccessMessage("URL deleted successfully!");
    } catch (err) {
      console.error("Error deleting URL:", err);
      setError("Error deleting URL. Please try again.");
    }
  };

  return (
    <Container>
      <Title>URL Shortener</Title>
      <Form onSubmit={handleShorten}>
        <Input
          type="text"
          placeholder="Enter URL to shorten"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit">Shorten URL</Button>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      {shortenedUrl && (
        <p>
          Shortened URL:{" "}
          <ShortUrl
            href={shortenedUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortenedUrl}
          </ShortUrl>
        </p>
      )}
      {isAuthenticated && urls.length > 0 && (
        <>
          <h3>My Shortened URLs</h3>
          <UrlList>
            {urls.map(({ shortId, url, accessCount, lastUpdated }) => (
              <UrlItem key={shortId}>
                {editing === shortId ? (
                  <>
                    <Input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="New URL"
                    />
                    <Button onClick={() => handleEdit(shortId)}>Save</Button>
                    <Button onClick={() => setEditing(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <UrlDetails>
                      <UrlText>Original: {url}</UrlText>
                      
                      <UrlText>
                        Shortened:{" "}
                        <ShortUrl
                          href="#"
                          onClick={() => handleUrlClick(shortId)}
                        >{`http://localhost/${shortId}`}</ShortUrl>
                      </UrlText>
                      <AccessCount>Accesses: {accessCount}</AccessCount>
                      <UpdatedTime>
                        Last updated: {new Date(lastUpdated).toLocaleString()}
                      </UpdatedTime>
                    </UrlDetails>
                    <div>
                      <Button onClick={() => setEditing(shortId)}>Edit</Button>
                      <Button onClick={() => handleDelete(shortId)}>
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </UrlItem>
            ))}
          </UrlList>
        </>
      )}
    </Container>
  );
}

export default UrlShortener;
