import { Typography } from "@mui/material";

interface WaitingForDriverSheetProps {
     some: string
}

export default function WaitingForDriverSheet({ 
   some
}: WaitingForDriverSheetProps) 
{
    return <>
        <Typography
            sx={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: "center",
                padding: '15px',
                backgroundColor: 'rgba(100,100,50,0.2)',
            }}>
            Waiting for driver to accept your ride... {some}
        </Typography>
    </>
}