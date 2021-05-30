import React, { useState, useEffect } from 'react';
import { Timeline } from '../components/Timeline';
import { Following } from '../components/Following';
import { Follow } from '../components/Follow';
import users from '../json-api/users';
import messages from '../json-api/messages';
import { Button } from '../components/common/Button';

export function Dashboard() {
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [newMessage, setNewMessage] = useState([]);

    useEffect(() => {
        users.users.map((user) => {
            if (user.name === 'Me') {
                user.followers.map((f) => {
                    console.log(f);
                });
                setFollowers(user.followers);
                setFollowing(user.following);
            }
            return user;
        });
    });

    const updateMessage = (message) => {
        setNewMessage(message);
        console.log(message);
    };

    return (
        <div className='relative flex w-full h-full min-w-1280 mt-3'>
            <div className='w-3/12 h-500 pl-3'>
                {followers ? <Following styleClass='mb-6' list={followers} title='Following'></Following> : ''}
                {following ? <Follow title='Follow' list={following} ></Follow> : ''}
            </div>
            <div className='w-9/12 h-500 pl-6 pr-6'>
                {messages ? <Timeline title='Timeline' messages={messages.messages}></Timeline> : ''}
                <p className='mt-3'>Post a new nessage</p>
                <div className='mt-3 border border-1 h-24'>
                    <textarea className={'w-full h-full p-2 resize-none'}
                        value={newMessage} onChange={(e) => updateMessage(e.target.value)} />
                </div>
                <div className='mt-4 w-full flex justify-end'>
                    <Button width='w-108' height='h-50'>Post</Button>
                </div>
            </div>
        </div>
    );
}

Dashboard.propTypes = {};