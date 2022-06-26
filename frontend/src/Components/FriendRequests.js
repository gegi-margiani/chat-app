import axios from 'axios';
import { useEffect, useState } from 'react';
import ws from './socketConfig';

function FriendRequests(props) {
  const [isRequestsShown, setIsRequestsShown] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        const incomingRequestsCopy = [];
        if (data[0] && data[0].friendList) {
          if (Object.keys(data[0].friendList.requests.incoming).length > 0) {
            Object.keys(data[0].friendList.requests.incoming).forEach((key) => {
              axios
                .get(
                  `http://localhost:3000/people/personbyid/${data[0].friendList.requests.incoming[key]}`
                )
                .then((request) => {
                  return request.data;
                })
                .then((reqSender) => {
                  incomingRequestsCopy.push(reqSender[0]);
                });
            });
          } else {
            props.setIncomingRequests([]);
          }
          props.setIncomingRequests(incomingRequestsCopy);
        }
      });
    ws.addEventListener('message', (e) => {
      const newData = e.data;
      if (newData === 'refreshRequests') {
        axios
          .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
          .then((request) => {
            return request.data;
          })
          .then((data) => {
            const incomingRequestsCopy = [];
            if (data[0] && data[0].friendList) {
              if (
                Object.keys(data[0].friendList.requests.incoming).length > 0
              ) {
                Object.keys(data[0].friendList.requests.incoming).forEach(
                  (key) => {
                    axios
                      .get(
                        `http://localhost:3000/people/personbyid/${data[0].friendList.requests.incoming[key]}`
                      )
                      .then((request) => {
                        return request.data;
                      })
                      .then((reqSender) => {
                        incomingRequestsCopy.push(reqSender[0]);
                      });
                  }
                );
              } else {
                props.setIncomingRequests([]);
              }
              props.setIncomingRequests(incomingRequestsCopy);
            }
          });
      }
    });
  }, []);

  const acceptFriendRequest = async (e) => {
    e.preventDefault();
    const friend = await axios
      .get(`http://localhost:3000/people/personbyid/${e.target.className}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const me = await axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const incomingKeyName = Object.keys(me.friendList.requests.incoming).find(
      (key) => me.friendList.requests.incoming[key] === e.target.className
    );
    delete me.friendList.requests.incoming[incomingKeyName];
    const sentKeyName = Object.keys(friend.friendList.requests.sent).find(
      (key) => friend.friendList.requests.sent[key] === localStorage.id
    );
    delete friend.friendList.requests.sent[sentKeyName];
    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            friends: [...me.friendList.friends, e.target.className],
            requests: { ...me.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(() =>
        ws.send(
          JSON.stringify({
            instructions: ['refreshFriends', 'refreshRequests'],
          })
        )
      );

    axios
      .patch(
        `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            friends: [...friend.friendList.friends, localStorage.id],
            requests: { ...friend.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (props.searchText) {
          props.setFoundPeople([...data.foundPeople]);
        }
        props.setAllPeople([...data.allPeople]);
      });
    const updatedRequests = props.incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    props.setIncomingRequests([...updatedRequests]);
  };

  const rejectFriendRequest = async (e) => {
    e.preventDefault();
    const friend = await axios
      .get(`http://localhost:3000/people/personbyid/${e.target.className}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const me = await axios
      .get(`http://localhost:3000/people/personbyid/${localStorage.id}`)
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        return data[0];
      });
    const incomingKeyName = Object.keys(me.friendList.requests.incoming).find(
      (key) => me.friendList.requests.incoming[key] === e.target.className
    );
    delete me.friendList.requests.incoming[incomingKeyName];
    const sentKeyName = Object.keys(friend.friendList.requests.sent).find(
      (key) => friend.friendList.requests.sent[key] === localStorage.id
    );
    delete friend.friendList.requests.sent[sentKeyName];
    axios
      .patch(
        `http://localhost:3000/people/${localStorage.id}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...me.friendList,
            requests: { ...me.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(() => {
        ws.send(JSON.stringify({ instructions: ['refreshRequests'] }));
      });
    axios
      .patch(
        `http://localhost:3000/people/${e.target.className}/${localStorage.id}/${props.searchText}`,
        {
          friendList: {
            ...friend.friendList,
            requests: { ...friend.friendList.requests },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((request) => {
        return request.data;
      })
      .then((data) => {
        if (props.searchText) {
          props.setFoundPeople([...data.foundPeople]);
        }
        props.setAllPeople([...data.allPeople]);
      });
    const updatedRequests = props.incomingRequests.filter(
      (req) => req.id !== e.target.className
    );
    props.setIncomingRequests(updatedRequests);
  };

  return (
    <>
      <button
        type="button"
        className="inline-block"
        onClick={() => setIsRequestsShown(!isRequestsShown)}
      >
        Requests ({props.incomingRequests.length})
      </button>
      {isRequestsShown && props.incomingRequests.length > 0
        ? props.incomingRequests.map((element, i) => {
            return (
              <div key={i} className="people peopleInnerDiv">
                <div>
                  <span>
                    {element.first_name} {element.last_name}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    value="Accept"
                    className={element.id}
                    onClick={(e) => {
                      acceptFriendRequest(e);
                    }}
                  >
                    Accept
                  </button>
                  <button
                    value="Reject"
                    className={element.id}
                    onClick={(e) => {
                      rejectFriendRequest(e);
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        : null}
    </>
  );
}

export default FriendRequests;
