import React, {useContext, useState} from 'react'
import Tooltip from '@material-ui/core/Tooltip'
import LabelIcon from '@material-ui/icons/Label'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import AuthContext from '../context/auth/AuthContext'
import {supportedTags} from './tagData'
import IndicatorContext from '../context/indicators/IndicatorContext'
import fetchJson from '../util/fetchJson'

function TagButton({className, postId}) {
    const {isLoggedIn, username, password} = useContext(AuthContext)
    const {setLoading, showSnackbar} = useContext(IndicatorContext)
    const [anchorEl, setAnchorEl] = useState(null)

    const tags = supportedTags.map(tag => tag.toUpperCase())

    const handleTag = async tag => {
        try {
            setLoading('async')
            setAnchorEl(null)

            let {message, status} = await tagPost(username, postId, tag, 'tag')
            if (message.includes('Already tagged')) {
                const response = await tagPost(username, postId, tag, 'untag')
                status = response.status
            }
            if (!status !== '1') {
                console.warn('Error tagging post', message)
            }
        } catch (err) {
            console.error('Exception while tagging post', err)
            showSnackbar('Error while tagging post. Please try again later.', {variant: 'error'})
        } finally {
            setLoading(false)
        }
    }

    const tagPost = async (who, what, tag, action) => {
        const body = {who, what, tag, password, action}
        return fetchJson(`lol`, {method: 'POST', body})
    }

    if (!isLoggedIn) return null
    return (
        <React.Fragment>
            <Tooltip disableFocusListener title='Tag Post' enterDelay={350}>
                <LabelIcon className={className} onClick={event => setAnchorEl(event.target)}/>
            </Tooltip>

            {
                anchorEl && <Menu
                    keepMounted
                    open={!!anchorEl}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                >
                    {tags.map(tag => <MenuItem key={tag} onClick={() => handleTag(tag)}>{tag}</MenuItem>)}
                </Menu>
            }
        </React.Fragment>
    )
}

export default TagButton
