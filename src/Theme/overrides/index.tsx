import Button from "./Button";
import { Theme } from "@mui/material/styles";
import Typography from "./Typography";

export default function ComponentsOverRide(theme: Theme) {
    return Object.assign(
        Button(theme),
        Typography(theme),
    )
}
