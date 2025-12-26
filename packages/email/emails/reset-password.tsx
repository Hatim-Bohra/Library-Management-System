import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
    userFirstname?: string;
    resetPasswordLink?: string;
}

export const ResetPasswordEmail = ({
    userFirstname = "User",
    resetPasswordLink = "http://localhost:3000/reset-password",
}: ResetPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Reset your password for Lumina Library</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                Lumina Library
                            </Heading>
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Reset Your Password
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {userFirstname},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Someone recently requested a password change for your Lumina Library
                            account. If this was you, you can set a new password here:
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={resetPasswordLink}
                            >
                                Reset Password
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            If you don&apos;t want to change your password or didn&apos;t request this, just
                            ignore and delete this message.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            To keep your account secure, please don&apos;t forward this email to anyone.
                        </Text>
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            This link will expire in 1 hour.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ResetPasswordEmail;
