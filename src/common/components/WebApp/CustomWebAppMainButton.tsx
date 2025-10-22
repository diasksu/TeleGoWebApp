import { useTelegramWebApp } from '@kloktunov/react-telegram-webapp';
import { type FC, useEffect } from 'react';

// Define the props for the MainButton component
interface MainButtonProps {
	// The text displayed on the button
	text?: string;
	// Whether to display a loading spinner on the button
	progress?: boolean;
	// Whether to disable the button
	disable?: boolean;
	// The function to call when the button is clicked
	onClick?: () => void;
	// The background color of the button
	color?: string;
	// The text color of the button
	textColor?: string;
}

// Renders the MainButton component in a React application
const CustomWebAppMainButton: FC<MainButtonProps> = ({
	text = 'CONTINUE',
	progress = false,
	disable = false,
	color,
	textColor,
	onClick,
}) => {
	// Get the instance of MainButton from Telegram Web App
	const webApp = useTelegramWebApp();
	const webAppMainButton = webApp?.MainButton;

	// Set the color of the button
	useEffect(() => {
		const buttonColor = disable
			? color ?? webApp?.themeParams.hint_color
			: color ?? webApp?.themeParams.button_color;
		webAppMainButton?.setParams({
			color: buttonColor
		});
	}, [color, disable, webApp?.themeParams.button_color, webApp?.themeParams.hint_color, webAppMainButton]);

	// Set the text color of the button
	useEffect(() => {
		webAppMainButton?.setParams({
			text_color: textColor ?? webApp?.themeParams.button_text_color,
		});
	}, [textColor, webApp?.themeParams.button_text_color, webAppMainButton]);

	// Set the text displayed on the button
	useEffect(() => {
		webAppMainButton?.setText(text);
	}, [text, webAppMainButton]);

	// Enable or disable the button based on the "disable" prop
	useEffect(() => {
		if (webAppMainButton?.isActive && disable) {
			webAppMainButton?.disable();
		} else if (!webAppMainButton?.isActive && !disable) {
			webAppMainButton?.enable();
		}
	}, [disable, webAppMainButton]);

	// Show or hide the loading spinner on the button based on the "progress" prop
	useEffect(() => {
		if (!webAppMainButton?.isProgressVisible && progress) {
			webAppMainButton?.showProgress(false);
		} else if (webAppMainButton?.isProgressVisible && !progress) {
			webAppMainButton?.hideProgress();
		}
	}, [progress, webAppMainButton]);

	// Call the "onClick" function when the button is clicked
	useEffect(() => {
		if (!onClick) {
			return;
		}
		webAppMainButton?.onClick(onClick);
		return () => {
			webAppMainButton?.offClick(onClick);
		};
	}, [onClick, webAppMainButton]);

	// Show the button and clean up when the component is unmounted
	useEffect(() => {
		webAppMainButton?.show();
		return () => {
			webAppMainButton?.hide();
		};
	}, [webAppMainButton]);

    // If MainButton is not available, the component will not be rendered
	if (!webAppMainButton || !webApp)
	{ 
		return null;
	}
	
    return <></>	
};

export default CustomWebAppMainButton;
