import { View, Text, Image, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import Colors from './../../constants/Colors';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';

// Warming up the browser for better UX as suggested in Expo documentation
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Ensures that the browser completes its auth session if it was previously opened
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();
  
  // State for managing loading state during OAuth flow
  const [isLoading, setIsLoading] = useState(false);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  // State for CAPTCHA verification
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);

  // Generate a new CAPTCHA question
  const generateCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const newQuestion = `${num1} + ${num2}`;
    setCaptchaQuestion(newQuestion);
    setCaptchaAnswer(num1 + num2);
  }, []);

  useEffect(() => {
    generateCaptcha(); // Generate CAPTCHA on component mount
  }, [generateCaptcha]);

  // Handling button press for OAuth flow
  const onPress = useCallback(async () => {
    if (parseInt(captchaValue, 10) !== captchaAnswer) {
      Alert.alert('Invalid CAPTCHA', 'Please solve the CAPTCHA correctly.');
      return;
    }

    setIsLoading(true); // Indicate loading
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)/home', { scheme: 'myapp' }),
      });

      if (createdSessionId) {
        // Handle successful session creation
        console.log('Session created successfully:', createdSessionId);
        setActive && setActive({ session: createdSessionId });
      } else {
        // Handle alternative next steps like MFA, signIn, or signUp
        if (signIn || signUp) {
          console.log('Handle additional steps for sign-in or sign-up.');
        }
      }
    } catch (err) {
      console.error('OAuth error:', err);
    } finally {
      setIsLoading(false); // Reset loading state after the flow completes
    }
  }, [captchaValue, captchaAnswer, startOAuthFlow]);

  return (
    <View style={{ backgroundColor: Colors.WHITE, height: '100%' }}>
      <Image
        source={require('./../../assets/images/login.png')}
        style={{ width: '100%', height: 500 }}
      />
      <View style={{ padding: 10, display: 'flex', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'outfit-bold', fontSize: 20, textAlign: 'center' }}>Pawpal</Text>
        <Text style={{ fontFamily: 'outfit', fontSize: 18, textAlign: 'center', color: Colors.GRAY }}>
          Let's adopt the pet which you like and make their life happy again
        </Text>

        {/* CAPTCHA Input */}
        <Text style={{ marginTop: 20, fontSize: 16 }}>Solve the CAPTCHA: {captchaQuestion}</Text>
        <TextInput
          value={captchaValue}
          onChangeText={setCaptchaValue}
          keyboardType="numeric"
          placeholder="Enter your answer"
          style={{
            borderWidth: 1,
            borderColor: Colors.GRAY,
            borderRadius: 8,
            padding: 10,
            width: '80%',
            marginTop: 10,
          }}
        />

        <Pressable
          onPress={onPress}
          style={{
            padding: 14,
            marginTop: 20,
            backgroundColor: Colors.PRIMARY,
            width: '100%',
            borderRadius: 14,
            opacity: isLoading ? 0.6 : 1, // Indicate loading state visually
          }}
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={{ fontFamily: 'outfit-medium', fontSize: 20, textAlign: 'center' }}>
              Get Started
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
