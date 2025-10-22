import { 
    useTheme,
    Stack, 
    Typography,
    TextField} from '@mui/material';
import '../../../assets/css/takeme.css';
import type { ChangeEvent } from 'react';

type AddCommentSegmentProps = {
    caption: string;
    placeholder: string;
    comment?: string;
    setComment: (comment: string) => void;
};

export default function AddCommentSegment(props: Readonly<AddCommentSegmentProps>) {
    const theme = useTheme();

    function handleCommentChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const newComment = event.target.value;
        props.setComment(newComment);
    }

    return <Stack
        direction="column"
        spacing="10px"
        alignItems="left">
        
        <Typography>{props.caption}</Typography>

        <TextField
            value={props.comment}
            minRows={2}
            placeholder={props.placeholder}
            multiline
            sx={{
                padding: '0px',
                '.MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.text.secondary,
                    borderRadius: '10px'
                }
            }}
            onChange={handleCommentChange}/> 
    </Stack>
}