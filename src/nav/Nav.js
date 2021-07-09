import React, {useState} from 'react'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import UserMenu from '../userMenu/UserMenu'
import RefreshButton from './RefreshButton'
import NewThreadButton from './NewThreadButton'
import MessagesButton from './MessagesButton'
import FilterButton from '../filter/FilterButton'
import Drawer from '@material-ui/core/Drawer'
import {makeStyles} from '@material-ui/styles'

function Nav() {
    const classes = useStyles()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const closeDrawer = () => setDrawerOpen(false)

    return (
        <React.Fragment>
            <AppBar elevation={0}>
                <Toolbar variant="dense" className={classes.appBar}>
                    <IconButton size="small" className={classes.menuButton} onClick={() => setDrawerOpen(!drawerOpen)}>
                        <MenuIcon className={classes.white}/>
                    </IconButton>

                    <Typography variant="h5" className={classes.title}><a href="#root" class="chattyHead">Chatty</a></Typography>

                    <RefreshButton/>
                    <NewThreadButton/>
                    <FilterButton/>
                    <MessagesButton/>
                    <UserMenu/>
                </Toolbar>
            </AppBar>

            <Drawer open={drawerOpen} onClose={closeDrawer} className={classes.drawer}>
                <AppBar position="static" color="primary" className={classes.drawerAppBar}>
                    <Toolbar variant="dense">
                        <Typography variant="h6" className={classes.title}>Latest Chatty</Typography>
                    </Toolbar>
                </AppBar>

                <a
                    href="https://github.com/latestchatty/chatty"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.menuItem}>
                    <MenuItem onClick={closeDrawer}>Contribute</MenuItem>
                </a>
                <a
                    href="https://github.com/latestchatty/chatty/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.menuItem}>
                    <MenuItem onClick={closeDrawer}>Feedback</MenuItem>
                </a>
            </Drawer>
        </React.Fragment>
    )
}

const useStyles = makeStyles({
    appBar: {
        paddingRight: 8
    },
    white: {
        color: '#fff'
    },
    title: {
        color: '#fff',
        flex: 1
    },
    menuButton: {
        marginLeft: -15,
        marginRight: 8
    },
    menuItem: {
        textDecoration: 'none',
        color: 'inherit'
    }
})

export default Nav
