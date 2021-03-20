import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Home } from "./Home";

export const App = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    <Home />
                </Route>
            </Switch>
        </Router>
    )
}