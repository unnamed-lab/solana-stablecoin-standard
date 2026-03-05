import { Box, Text } from "ink";

const LOGO = `
 ▄▄████ █████   
███████ ████████
▀██████ ██████▀
  ▀▀███ █████
████▄   █████
██████▄ █████
██████▀ █████
████▀▀  ███`;

/**
 * Superteam Logo rendered with exact solid block characters 
 * mapped perfectly to the original SVG path geometry.
 * Sized down to ~100px visual equivalent width.
 */
export default function Brand() {
    return (
        <Box flexDirection="row" marginBottom={1} alignItems="flex-start">
            <Box flexDirection="column" marginRight={3}>
                <Text color="white">{LOGO}</Text>
            </Box>
            <Box flexDirection="column" paddingTop={2}>
                <Box>
                    <Text bold color="magenta">SOLANA</Text>
                    <Text bold color="yellow"> SUPERTEAM</Text>
                </Box>
                <Text dimColor>Stablecoin Standard — Terminal v0.1.0</Text>
            </Box>
        </Box>
    );
}
